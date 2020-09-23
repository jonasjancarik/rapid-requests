# Usage

```const rapidRequests = require('./index')```

`rapidRequests` takes two arguments:
- an array of URLs
- a config object

It returns a promise / array of results, containing both successful and unsuccesful requests.

# API

## rapidRequests(urls, config?)

### urls

Type: `array`

Array of URL strings.

#### Example
`['https://google.com', 'https://example.com']`

### config

Type: `object`, optional

Available config values:

#### responseTransform (`function`)

Applied to each response as they come in, useful if you want to perform other time-expensive operations on each result and do not want to wait for all requests to be finished.

#### resultTransform (`function`)

Applied to each result after all requests are finished.

#### progressBar (`boolean`|`string`)

Set to `true` to display a progress bar in the terminal.

You can also submit a [progress](https://www.npmjs.com/package/progress) template string.

#### throttle (`integer`)

Time in milliseconds to wait between sending requests (useful to avoid overloading your network interface or getting rate limited)

#### axiosConfig (`object`)

Note that by default, axios does not timeout requests. Use the `timeout` parameter if you want to set a timeout. Timeout will result in `status: 'rejected'`.

## returns

These results can have two forms:

For successfuly resolved requests:

```js
{
  status: "fulfilled",
  value: {
    url: "https://example.com",
    response: { ... },
    transformResult: null,
  },
}
```


If there was an error:

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

# Example

```js
rapidRequests(urls, {
    // resultTransform,
    progressBar: true,
    throttle: 100
})
.then(results => {
        for (const result of results) {
            if (result.status === 'fulfilled') {
                for (const advert of result.value.response.data.advert) {
                    fs.writeFileSync(`output/${advert.advert_id}.json`, JSON.stringify(advert, null, '\t'))
                }
            }
        }
        console.log('Done.')
    }
)
.catch(e => console.log(e))```
