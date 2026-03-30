import { createHttpStoryApi } from "./adapters/httpStoryApi.js";
import { createDomStoryView } from "./adapters/domStoryView.js";
import { createStoryApp } from "./application/storyApp.js";

const storyApi = createHttpStoryApi();
const view = createDomStoryView();
const app = createStoryApp({ storyApi, view });

app.init();
