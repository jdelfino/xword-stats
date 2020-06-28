import React, { useEffect } from 'react';
import AWS from 'aws-sdk';
import moment from 'moment';
import { Grid, Paper, Container, Typography, TableHead, CircularProgress, Table, TableContainer, TableCell, TableRow, TableBody, AppBar, Toolbar } from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';

const tableName = "xword";

const theme = {
  spacing: 8,
}

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: "lightgrey",
    fontSize: 14,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

const WinnerTableRow = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.success.main,
  },
}))(TableRow);

function computePoints(data) {
  const daycounts = {}
  for (const i of data) {
    if (i.date in daycounts) {
      daycounts[i.date] += 1;
    } else {
      daycounts[i.date] = 1;
    }
  }

  const points = {};
  let max = 0;
  for (const i of data) {
    if (i.name in points) {
      points[i.name] += daycounts[i.date] - i.rank + 1
    } else {
      points[i.name] = daycounts[i.date] - i.rank + 1
    }
    if (points[i.name] > max) {
      max = points[i.name]
    }
  }
  var sorted_points = [];
  for (var name in points) {
    sorted_points.push([name, points[name], points[name] === max]);
  }
  sorted_points.sort(function(a, b) { return b[1] - a[1] });

  return sorted_points;
}


function Leaderboard() {
  const [data, setData] = React.useState([]);
  const [fetching, setFetching] = React.useState(true);

  AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000",
    accessKeyId: "fakeMyKeyId",
    secretAccessKey: "fakeSecretAccessKey",
    sslEnabled:     false,
    //credentials: new AWS.CognitoIdentityCredentials({IdentityPoolId: 'us-west-2:5741b905-328d-4492-95bc-edc91cffac26'})
  });

  useEffect(() => {
    setFetching(true);
    async function populate() {
      console.log("FETCHING DATA")
      var dynamodb = new AWS.DynamoDB();

      let times = await dynamodb.scan({TableName: tableName}).promise();
      console.log("TIMES", times);
      setData(times.Items.map(o => {
        return {
          "date": o.date.S,
          "name": o.name.S,
          "rank": parseInt(o.rank.N),
          "time_secs": parseInt(o.time_secs.N)
        }
      }));
    };
    populate();
    setFetching(false);
  }, []);

  console.log("RENDERING", data);
  /*
  const last_sunday = moment().startOf('week').subtract(1, "week");
  const this_sunday = moment().startOf('week');
  */
  const last_sunday = moment().startOf('week').subtract(2, "week");
  const this_sunday = moment().startOf('week').subtract(1, "week");

  const last_week = computePoints(data.filter(o => {
    const d = moment(o.date);
    return d >= last_sunday && d < this_sunday;
  }));

  const this_week = computePoints(data.filter(o => moment(o.date) >= this_sunday));

  console.log("last week", last_week);
  console.log("this week", this_week);
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            NYT Crossword Stats
          </Typography>
        </Toolbar>
      </AppBar>

      <Container>
      {fetching && <CircularProgress />}
      {!fetching &&
        <div>
          <Grid container spacing={3}>
          {last_week.length > 0 &&
            <Grid item xs={12}>
              <h2>Last Week's Winner: {last_week[0][0]} ({last_week[0][1]} points)</h2>
            </Grid>
          }
          {last_week &&
            <Grid item xs={12}>
              <TableContainer component={Paper} m={3}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Name</StyledTableCell>
                      <StyledTableCell>Points</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {last_week.map(o =>
                      o[2] ? (
                        <WinnerTableRow key={o[0]}>
                          <TableCell>{o[0]}</TableCell>
                          <TableCell>{o[1]}</TableCell>
                        </WinnerTableRow>
                      ) : (
                        <TableRow key={o[0]}>
                          <TableCell>{o[0]}</TableCell>
                          <TableCell>{o[1]}</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          }
          {this_week.length > 0 &&
            <Grid item xs={12}>
              <h2>This Week's Leader: {this_week[0][0]} ({this_week[0][1]} points)</h2>
            </Grid>
          }
          {this_week &&
            <Grid item xs={12}>
              <TableContainer component={Paper} m={3}>
                <Table>
                  <TableBody>
                    {this_week.map(o =>
                      <TableRow key={o[0]}>
                        <TableCell>{o[0]}</TableCell>
                        <TableCell>{o[1]}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          }
            <Grid item xs={12}>
              <TableContainer component={Paper} m={3}>
                <Table>
                  <TableBody>
                    {data && data.map(o =>
                      <TableRow key={o.date + "-" + o.name}>
                        <TableCell>{o.date}</TableCell>
                        <TableCell>{o.name}</TableCell>
                        <TableCell>{o.rank}</TableCell>
                        <TableCell>{o.time_secs}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </div>
      }
      </Container>
    </div>
  )
};

export default Leaderboard;