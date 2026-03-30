import { createHttpStoryApi } from "./adapters/httpStoryApi.js";
import { createDomStoryReaderView } from "./adapters/domStoryReaderView.js";
import { createStoryReaderApp } from "./application/storyReaderApp.js";

const params = new URLSearchParams(window.location.search);
const storyId = params.get("storyId");

const storyApi = createHttpStoryApi();
const view = createDomStoryReaderView();
const app = createStoryReaderApp({ storyApi, view });

app.init(storyId);
