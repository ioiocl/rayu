import { createHttpStoryApi } from "./adapters/httpStoryApi.js";
import { createHttpAuthApi } from "./adapters/httpAuthApi.js";
import { createHttpUserApi } from "./adapters/httpUserApi.js";
import { createDomStoryView } from "./adapters/domStoryView.js";
import { createDomMediaCaptureView } from "./adapters/domMediaCaptureView.js";
import { createStoryApp } from "./application/storyApp.js";
import { createAuthApp } from "./application/authApp.js";

const storyApi = createHttpStoryApi();
const authApi = createHttpAuthApi();
const userApi = createHttpUserApi();
const view = createDomStoryView();

const storyMediaCapture = createDomMediaCaptureView("story");
window.storyMediaCapture = storyMediaCapture;

const authApp = createAuthApp({ 
  authApi, 
  userApi, 
  onAuthChange: (user) => {
    view.updateAuthState(user);
  }
});

const app = createStoryApp({ storyApi, view, authApp });

authApp.init();
app.init();
storyMediaCapture.init();
