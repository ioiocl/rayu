import { createHttpStoryApi } from "./adapters/httpStoryApi.js";
import { createHttpAuthApi } from "./adapters/httpAuthApi.js";
import { createHttpUserApi } from "./adapters/httpUserApi.js";
import { createDomStoryReaderView } from "./adapters/domStoryReaderView.js";
import { createStoryReaderApp } from "./application/storyReaderApp.js";
import { createAuthApp } from "./application/authApp.js";

const params = new URLSearchParams(window.location.search);
const storyId = params.get("storyId");

const storyApi = createHttpStoryApi();
const authApi = createHttpAuthApi();
const userApi = createHttpUserApi();
const view = createDomStoryReaderView();

const authApp = createAuthApp({ 
  authApi, 
  userApi, 
  onAuthChange: (user) => {
    view.updateAuthState(user);
  }
});

const app = createStoryReaderApp({ storyApi, view });

authApp.init();
app.init(storyId);
