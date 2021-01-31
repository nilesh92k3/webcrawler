const app = require("./../app");
const supertest = require("supertest");
const request = supertest(app);

const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const htmls = require("./data/htmlresponses.json");

var mock = new MockAdapter(axios);

describe("Endpoint tests ::", () => {
  beforeAll(async () => {
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

  test("It should be able to hit the crawl api :: ", async () => {
    const res = await request
      .get("/crawl")
      .query({ url: "https://buildit.wiprodigital.com/", depth: 3 });

    const parsedRes = JSON.parse(res.text);
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

    expect(parsedRes).toEqual(expectedRes);
  });

  test("It should throw 404 for incorrect path :: ", async () => {
    const res = await request
      .get("/invalidUrl")
      .query({ url: "https://buildit.wiprodigital.com/", depth: 3 });

    expect(res.statusCode).toEqual(404);
  });
});
