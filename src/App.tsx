import * as React from "react";
import { render } from "react-dom";

import "./styles.css";
import { HashRouter, Route, Link, Switch } from "react-router-dom";

import { Steps } from "./Steps";

function App() {
  return (
    <div className="App">
      <HashRouter>
        {/* main route component */}
        <Switch>
          {/* switch displays only one component that matches */}
          <Route path="/steps/:stepId" component={Steps} />
          {/* the div below shows when there is no match */}
          <div>
            <h1>Welcome, User</h1>
            <Link to="/steps/1">Go To Steps Page</Link>
          </div>
        </Switch>
      </HashRouter>
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
