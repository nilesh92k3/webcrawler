const axios = require("axios");
const cheerio = require("cheerio");
const Queue = require("queue-fifo");
const pLimit = require("p-limit");
const { getDomain } = require("tldjs");
const CONFIG = require("./../config/crawlerconfig.json");

module.exports = {
  crawlTillDepth: crawlTillDepth,
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isValidUrl(link) {
  regexp = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
  return regexp.test(link);
}

function isInternalUrl(link, domain) {
  const linkDomain = getDomain(link);
  return linkDomain == domain;
}

function isAbsoluteUrl(url) {
  return url.indexOf("://") > 0 || url.indexOf("//") === 0;
}

function getCompleteUrl(path, baseUrl) {
  return new URL(path, baseUrl).href;
}

async function getLinks(url) {
  try {
    const { data } = await axios({
      method: "get",
      url: url,
      timeout: CONFIG.CONNECTION_TIMEOUT,
    });

    let $ = cheerio.load(data);
    links = $("a");
    links = links
      .toArray()
      .map(
        (link) =>
          link &&
          link.attribs &&
          link.attribs.href &&
          (isAbsoluteUrl(link.attribs.href)
            ? link.attribs.href
            : getCompleteUrl(link.attribs.href, url))
      );
    console.log("Crawled page :: ", url);

    return links;
  } catch (e) {
    console.error("Error while crawling url :: ", url, e);
    return [];
  }
}

async function crawlTillDepth(url, depth) {
  const queue = new Queue();
  const seen = new Set();

  if (isValidUrl(url)) {
    queue.enqueue(url);
    seen.add(url);
  } else {
    console.log("Not valid starting url, crawling will be skipped");
  }

  const externalLinks = [];
  const domain = getDomain(url);

  while (!queue.isEmpty() && depth) {
    var nodeCount = queue.size();

    var tasks = 0;
    const limit = pLimit(CONFIG.MAX_CONNS);
    const promises = [];

    //Crawl all pages at current level
    while (nodeCount--) {
      const front = queue.dequeue();
      promises.push(limit(() => getLinks(front)));
      tasks++;

      if (tasks == CONFIG.MAX_CONNS) {
        promises.push(limit(() => sleep(CONFIG.SLEEP_TIME)));
        tasks = 0;
      }
    }

    const result = await Promise.all(promises);
    var fetchedlinks = result.flat();
    fetchedlinks = Array.from(new Set(fetchedlinks)).filter(
      (link) => isValidUrl(link) && !seen.has(link)
    );

    fetchedlinks
      .filter((link) => !isInternalUrl(link, domain))
      .forEach((link) => {
        externalLinks.push(link);
      });

    fetchedlinks = fetchedlinks.filter((link) => isInternalUrl(link, domain));
    fetchedlinks.forEach((link) => {
      seen.add(link);
      queue.enqueue(link);
    });

    console.log("Depth :: ", depth);
    depth--;
  }

  var response = {
    internalLinks: Array.from(seen),
    externalLinks: externalLinks,
  };
  return Promise.resolve(response);
}
