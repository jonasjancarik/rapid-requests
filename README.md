This package makes sending concurrent HTTP requests easy, with optional callbacks (transformations) applied to resolved requests while others are still pending.

Under the hood, it uses [Axios](https://www.npmjs.com/package/axios) for the HTTP requests and makes uses of [Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled).

# Installation

```npm i rapid-requests```

# Usage

```const rapidRequests = require('rapid-requests')```

`rapidRequests` takes two arguments:
1) an `array` of URLs
2) a config `object`

Once all of the requests are finished, an array of results is returned,  containing both successful and unsuccesful requests (with error details included).

## Example

In this example, we are requesting responses from an API returning JSON objects like `{"posts":[{"id":456456,"views":5612},{"id":56289,"views":4562}]}` and saving the data to JSON files.

```js
rapidRequests(urls, {
  progressBar: true,
  throttle: 100,
  axiosConfig: {
    timeout: 1000
  }
})
.then(results => {
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const advert of result.value.response.data.posts) {
          fs.writeFileSync(
              `output/${post.post_id}.json`,
              JSON.stringify(post, null, '\t')
          )
        }
      }
    }
    console.log('Done.')
  }
)
.catch(e => console.error(e))
```

Or using async/await:

```js
(async function () {
  const results = await rapidRequests(urls, {
    progressBar: true,
    throttle: 100,
    axiosConfig: {
      timeout: 1000,
    },
  });
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const post of result.value.response.data.posts) {
        fs.writeFileSync(
          `output/${post.id}.json`,
          JSON.stringify(post, null, '\t'),
        );
      }
    }
  }
}());
```

# API

## rapidRequests(urls, config?)

### urls (`array`)

Array of URL strings.

#### Example
`['https://google.com', 'https://example.com']`

### config (`object`), optional

Available config values:

#### responseTransform (`function`)

Applied to each response as they come in, useful if you want to perform other time-expensive operations on each result and do not want to wait for all requests to be finished.

#### resultTransform (`function`)

Applied to each result after all requests are finished. This can be used to change the format of the final result objects, though it may be more transparent to process the result objects in your code in a .then() block or similar.

#### progressBar (`boolean`|`string`)

Set to `true` to display a progress bar in the terminal.

You can also submit a [progress](https://www.npmjs.com/package/progress) template string.

#### throttle (`integer`)

Time in milliseconds to wait between sending requests (useful to avoid overloading your network interface or getting rate limited)

#### axiosConfig (`object`)

Requests are made using Axios, so you can pass an axios-style config object which will be used for each request. The `url` parameter of the config object will be overwritten.

Note that by default, axios does not set a timeout for requests. Use the `timeout` parameter if you want to set a timeout. Timeout will result in `status: 'rejected'`.

## Returns

Results contained in the returned array can be of two types, depending on whether the particular request was successful or not.

For successfuly resolved requests:

```js
{
  status: "fulfilled",
  value: {
    url: "https://example.com",
    response: { ... },
    transformResult: null,
  }
}
```


For requests during which an error occurred:

```js
{
  status: "rejected",
  reason: {
    url: "http://this.url.doesnt.exist",
    error: {
      message: "Request failed with status code 400",
      name: "Error",
      stack: "...",
      config: { ... }
    }
  }
}
```