// @refresh reload
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "./app.css";
import "./location.css";
import "./home.css";
import "./kiblat.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <Suspense fallback={<div class="loading">Loading...</div>}>
          {props.children}
        </Suspense>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
