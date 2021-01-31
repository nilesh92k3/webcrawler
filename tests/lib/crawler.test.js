const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const htmls = require("./../data/htmlresponses.json");
const crawler = require("./../../lib/crawler");

var mock = new MockAdapter(axios);

describe("Crawler tests :: success", () => {
  beforeEach(() => {
    mock
      .onGet("https://buildit.wiprodigital.com/")
      .reply(200, htmls["build_it"]);
    mock
      .onGet("https://buildit.wiprodigital.com/about/")
      .reply(200, htmls["about"]);
    mock
      .onGet("https://buildit.wiprodigital.com/careers/")
      .reply(200, htmls["careers"]);
    mock
      .onGet("https://buildit.wiprodigital.com/locations/")
      .reply(200, htmls["locations"]);
    mock
      .onGet("https://buildit.wiprodigital.com/privacypolicy/")
      .reply(200, htmls["privacy_policy"]);
    mock
      .onGet("https://buildit.wiprodigital.com/#the-hiring-process")
      .reply(200, "");
  });

  test("It should only crawl one page for depth 1 :: ", async () => {
    mock.resetHistory();
    await crawler.crawlTillDepth("https://buildit.wiprodigital.com/", 1);

    expect(mock.history.get.length).toBe(1);
  });

  //The first test page has 2 internal links hence total 3 pages have to be crawled
  test("It should crawl 3 pages page for depth 2 :: ", async () => {
    mock.resetHistory();
    await crawler.crawlTillDepth("https://buildit.wiprodigital.com/", 2);

    expect(mock.history.get.length).toBe(3);
  });

  test("It should not crawl any pages page for depth 0 :: ", async () => {
    mock.resetHistory();
    await crawler.crawlTillDepth("https://buildit.wiprodigital.com/", 0);

    expect(mock.history.get.length).toBe(0);
  });

  test("It should not crawl any pages page if depth null :: ", async () => {
    mock.resetHistory();
    await crawler.crawlTillDepth("https://buildit.wiprodigital.com/", null);

    expect(mock.history.get.length).toBe(0);
  });

  /*
    Careers page has link to Locations page, and locations page has link to Careers page,
    forming a cycle. Crawler should not run into infinite loop.
    */
  test("It should not run into infinite loop :: ", async () => {
    mock.resetHistory();
    const res = await crawler.crawlTillDepth(
      "https://buildit.wiprodigital.com/",
      3
    );

    expect(res).toBeTruthy();
  });

  test("It should not crawl a duplicate url again :: ", async () => {
    mock.resetHistory();
    await crawler.crawlTillDepth("https://buildit.wiprodigital.com/", 10);

    const countOccurrences = (arr, val) =>
      arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

    const crawledUrls = mock.history.get.map((x) => x.url);
    const duplicates = crawledUrls.filter(
      (x) => countOccurrences(crawledUrls, x) > 1
    );

    expect(duplicates.length).toBe(0);
  });

  test("Response structure :: ", async () => {
    mock.resetHistory();
    const res = await crawler.crawlTillDepth(
      "https://buildit.wiprodigital.com/",
      3
    );
    const expectedRes = {
      internalLinks: [
        "https://buildit.wiprodigital.com/",
        "https://buildit.wiprodigital.com/about/",
        "https://buildit.wiprodigital.com/careers/",
        "https://buildit.wiprodigital.com/privacypolicy/",
        "https://buildit.wiprodigital.com/#the-hiring-process",
        "https://buildit.wiprodigital.com/locations/",
      ],
      externalLinks: [
        "https://medium.com/buildit",
        "https://medium.com/buildit",
      ],
    };

    expect(res).toEqual(expectedRes);
  });
});

describe("Crawler tests :: Failure", () => {
  beforeEach(() => {
    mock.reset();
  });

  test("It should not crawl any new urls if baseUrl not found :: ", async () => {
    const res = await crawler.crawlTillDepth(
      "https://buildit.wiprodigital.com/",
      1
    );

    const expectedRes = {
      internalLinks: ["https://buildit.wiprodigital.com/"],
      externalLinks: [],
    };

    expect(res).toEqual(expectedRes);
  });

  test("It should not fail if some urls return 404 :: ", async () => {
    mock
      .onGet("https://buildit.wiprodigital.com/")
      .reply(200, htmls["build_it"]);
    mock.onGet("https://buildit.wiprodigital.com/about/").reply(404);
    mock.onGet("https://buildit.wiprodigital.com/careers/").reply(404);
    const res = await crawler.crawlTillDepth(
      "https://buildit.wiprodigital.com/",
      3
    );

    const expectedRes = {
      internalLinks: [
        "https://buildit.wiprodigital.com/",
        "https://buildit.wiprodigital.com/about/",
        "https://buildit.wiprodigital.com/careers/",
      ],
      externalLinks: [],
    };

    expect(res).toEqual(expectedRes);
  });

  test("It should not fail if some urls timeout :: ", async () => {
    mock
      .onGet("https://buildit.wiprodigital.com/")
      .reply(200, htmls["build_it"]);
    mock.onGet("https://buildit.wiprodigital.com/about/").timeout();
    mock.onGet("https://buildit.wiprodigital.com/careers/").timeout();
    const res = await crawler.crawlTillDepth(
      "https://buildit.wiprodigital.com/",
      3
    );

    const expectedRes = {
      internalLinks: [
        "https://buildit.wiprodigital.com/",
        "https://buildit.wiprodigital.com/about/",
        "https://buildit.wiprodigital.com/careers/",
      ],
      externalLinks: [],
    };

    expect(res).toEqual(expectedRes);
  });

  test("It should not fail if some urls throw network error :: ", async () => {
    mock
      .onGet("https://buildit.wiprodigital.com/")
      .reply(200, htmls["build_it"]);
    mock.onGet("https://buildit.wiprodigital.com/about/").networkError();
    mock.onGet("https://buildit.wiprodigital.com/careers/").networkError();
    const res = await crawler.crawlTillDepth(
      "https://buildit.wiprodigital.com/",
      3
    );

    const expectedRes = {
      internalLinks: [
        "https://buildit.wiprodigital.com/",
        "https://buildit.wiprodigital.com/about/",
        "https://buildit.wiprodigital.com/careers/",
      ],
      externalLinks: [],
    };

    expect(res).toEqual(expectedRes);
  });
});
