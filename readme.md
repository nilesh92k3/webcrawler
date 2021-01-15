# Webcrawler

Webcrawler is web crawling spider service written in Nodejs using the axios and cheerio modules

## Algorithm
The crawler takes two parameters *startUrl* and *depth*. Essentially the crawler follows a Breadth First Search traversal where it first crawls the starting url, then crawls all the child urls (urls present on the current page being crawled), then crawls the subsequent children of the child urls and so on, thus recursively crawling till the required depth is reached or until it cannot find any more new links. External links are not crawled.

- ### Steps:

1. Enqueue starting url.
2. Mark starting url as seen.
3. Pop all the urls from queue.
4. Crawl all the popped urls obtained in step 3.
5. Find all links fetched obtained in step4.
6. Filter out all the invalid urls.
7. Enqueue all the fetched internal urls.
8. Mark the enqueued urls as seen.
9. If queue is not empty and we have not yet reached the required depth go to step 3 .
10. return the internal urls and the external urls.

## Build and run the crawler service
### Pre-requisites
You must either have (**Node** and **NPM**) or **Docker** installed on your system
Checkout code from the master branch, then go into the project directory and run the following commands.
#### 1. To run using Node:
You simply need to run *npm install* and *node .*




```bash
npm install
```
After successful installation run:

```bash
node .
```
#### 2. To run using Docker:

```bash
docker build -t webcrawler .
docker run -p 3000:3000 -d webcrawler
```

## Usage
If you want to crawl the url *http://buildit.wiprodigital.com* till a depth of 3 levels hit a *GET* request as shown below:

```
http://localhost:3000/crawl?url=http://buildit.wiprodigital.com&depth=3
```

## Response structure
```
{"internalLinks":["http://buildit.wiprodigital.com","http://buildit.wiprodigital.com/about/","http://buildit.wiprodigital.com/careers/","http://buildit.wiprodigital.com/locations/","http://buildit.wiprodigital.com/","https://wiprodigital.com/privacy-policy"],"externalLinks":["https://medium.com/buildit","https://medium.com/buildit/","https://www.instagram.com/buildit_tech","https://twitter.com/buildit_tech","https://www.linkedin.com/company/buildit.","https://github.com/buildit"]}
```

## Configuration
The crawler configurations can be found in *config/crawlerconfig.json*. 

1. *MAX_CONNS* - How many maximum crawl requests will be triggered in a batch by the crawler. 

2. *CONNECTION_TIMEOUT* - After how many milliseconds every request will be timed out. 

3. *SLEEP_TIME* - After every batch of crawl requests sent together is finished the crawler waits for *SLEEP_TIME* milliseconds before trigerring the next batch of requests.

example *crawlerconfig.json*

```bash
{
    "MAX_CONNS": 30,
    "CONNECTION_TIMEOUT": 20000,
    "SLEEP_TIME": 5000 
}

```
