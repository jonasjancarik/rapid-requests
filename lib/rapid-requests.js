const axios = require('axios');
const ProgressBar = require('progress');
const { promisify } = require('util');

const sleep = promisify(setTimeout);

// todo: add type check for transforms - must be functions
function rapidRequests(urls = [], {
  responseTransform = () => null,
  resultTransform = (result) => result,
  discardResponse = false,
  throttle = 0, // time between requests
  progressBar = false, // can be true, false or a string template for progress
  axiosConfig = {},
} = {}) {
  return new Promise((resolve, reject) => {
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
      if (bar) bar.tick(0, { pendingCount: launchedCount - finishedCount });

      // throttle
      await sleep(throttle * jobCount);

      launchedCount += 1;

      return new Promise((resolveThis, rejectThis) => {
        const thisAxiosConfig = axiosConfig;

        thisAxiosConfig.url = encodeURI(url);

        try {
          axios(thisAxiosConfig)
            .then(async (response) => {
              // progress bar tick and increase finishedCount
              if (progressBar) {
                finishedCount += 1;
                if (bar) bar.tick(1, { pendingCount: launchedCount - (finishedCount) });
              }

              const transformResult = await responseTransform(response);

              // resolve promise
              if (discardResponse) {
                resolveThis({ url, transformResult });
              } else {
                resolveThis({ url, response, transformResult });
              }
            })
            .catch((error) => {
              // progress bar tick and increase finishedCount
              if (progressBar) {
                finishedCount += 1;
                if (bar) bar.tick(1, { pendingCount: launchedCount - (finishedCount) });
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
      .then(async (results) => {
        // ... process each using the result transform
        // eslint-disable-next-line no-restricted-syntax
        for (const result of results) {
          // eslint-disable-next-line no-await-in-loop
          const transformResult = await resultTransform(result);
          outcomes.push(transformResult);
        }

        resolve(outcomes);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

module.exports = rapidRequests;
