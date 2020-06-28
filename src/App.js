import React from 'react';
import './App.css';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import TimeTable from "./TimeTable";
import Leaderboard from "./Leaderboard";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Switch>
          <Route path="/leaderboard" component={Leaderboard} exact/>
          <Route path="/" component={TimeTable}/>
        </Switch>
      </div>
    </BrowserRouter>
  )
}

export default App;
