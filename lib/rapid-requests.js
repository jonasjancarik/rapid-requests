const axios = require('axios');
const ProgressBar = require('progress');
const { promisify } = require('util');

const sleep = promisify(setTimeout);

function rapidRequests(urls, {
  responseTransform = () => null,
  resultTransform = (result) => result,
  throttle = 0, // time between requests
  requestTimeout = 60000, // max duration of an http request
  progressBar = false,
  method = 'get',
} = {}) {
  return new Promise((resolve, reject) => {
    // config options
    const config = {
      throttle,
      requestTimeout,
      method,
    };

    // todo: option to use custom bar
    let bar;

    // counters
    let jobCount = 0; // total number of jobs/requests created
    let launchedCount = 0;
    let finishedCount = 0; // number of requests finished (whether successful or not)

    // initiate progress bar
    if (progressBar) {
      const barTemplate = typeof progressBar === 'string'
        ? progressBar
        : 'checked :current/:total [:bar] :rate per second :percent ETA: :etas Pending: :pendingCount';
      bar = new ProgressBar(barTemplate, { total: urls.length });
      bar.tick(0, { pendingCount: jobCount - finishedCount });
    }

    // starts and returns a new request (promise);
    async function createRequest(url) {
      // progress bar tick
      bar.tick(0, { pendingCount: launchedCount - finishedCount });

      // throttle
      await sleep(config.throttle * jobCount);

      launchedCount += 1;

      return new Promise((resolveThis, rejectThis) => {
        try {
          axios({
            method: config.method,
            url: encodeURI(url),
            timeout: config.requestTimeout,
          })
            .then((response) => {
              // progress bar tick and increase finishedCount
              if (progressBar) {
                finishedCount += 1;
                bar.tick(1, { pendingCount: launchedCount - (finishedCount) });
              }

              // resolve promise
              resolveThis({ url, response, transformResult: responseTransform(response) });
            })
            .catch((error) => {
              // progress bar tick and increase finishedCount
              if (progressBar) {
                finishedCount += 1;
                bar.tick(1, { pendingCount: launchedCount - (finishedCount) });
              }

              // reject promise
              // eslint-disable-next-line prefer-promise-reject-errors
              rejectThis({ url, error });
            });
        } catch (e) {
          reject(e);
        }
      });
    }

    // outcomes array will store the data we want to keep on record for each URL
    const outcomes = [];

    // Create requests/promises from all URLs; when all are settled...
    Promise.allSettled(urls.map((url) => {
      jobCount += 1;
      return createRequest(url);
    }))
      .then((results) => {
        // ... process each accordingly
        results.forEach((result) => {
          outcomes.push(resultTransform(result));
        });

        resolve(outcomes);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

module.exports = rapidRequests;
