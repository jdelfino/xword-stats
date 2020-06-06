import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { CircularProgress, InputBase, Button, Table, TableHead, Typography, TableCell, TableRow, TableBody, AppBar, Toolbar } from '@material-ui/core';
import { Scraper } from './services/Scraper';
import moment from 'moment';
import format from 'format-duration';
import { fade, makeStyles } from '@material-ui/core/styles';
import Charts from './Charts';
import Box from '@material-ui/core/Box';

//const cloneDeep = require('lodash/cloneDeep');

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

function comparePuzz(a,b) {
  let pubtype = a.publish_type.localeCompare(b.publish_type);
  if (pubtype !== 0) {
    return pubtype;
  }
  return a.print_date.localeCompare(b.print_date);
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function TimeTable() {
  const classes = useStyles();
  const [cookie, setCookie] = React.useState(localStorage.getItem('cookie') || '');
  const [times, setTimes] = React.useState([]);
  const [fetching, setFetching] = React.useState(false);
  const [newData, setNewData] = React.useState(true);
  const [tabValue, setTabValue] = React.useState(0);

  useEffect(() => {
    console.log("useEffect newData")
    async function populate() {
      // TODO: push sort down?
      let times = await Scraper.getAllTimes(cookie, moment.duration(1, 'month'));
      times.sort(comparePuzz);
      setTimes(times);
      setNewData(false);
    };
    populate();
  }, [newData, cookie]);

  function handleCookie(e) {
    setCookie(e.target.value);
    localStorage.setItem('cookie', e.target.value);
  }

  async function handleFetch(e) {
    setFetching(true);
    await Scraper.fetchAllTimes(cookie, moment.duration(1, 'month'));
    setFetching(false);
    setNewData(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            NYT Crossword Stats
          </Typography>
          <div className={classes.grow} />
          <div className={classes.search}>
            <InputBase
              placeholder="NYT Cookie..."
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              value={cookie}
              inputProps={{ 'aria-label': 'search' }}
              onChange={handleCookie} />
          </div>
          <Button variant="contained" onClick={handleFetch}>Fetch</Button>
        </Toolbar>
      </AppBar>

      <Tabs
        value={tabValue}
        indicatorColor="primary"
        textColor="primary"
        onChange={handleTabChange}
        aria-label="disabled tabs example"
        centered
      >
        <Tab label="Daily" />
        <Tab label="Mini" />
      </Tabs>
      <TabPanel value={tabValue} index={0} name="Daily" >
        <Charts filtered_times={times.filter(x =>(x.publish_type === 'Daily' && (moment(x.print_date) > moment('2019-01-01'))))}/>
      </TabPanel>
      <TabPanel value={tabValue} index={1} name="Mini">
        <Charts filtered_times={times.filter(x => x.publish_type === 'Mini')}/>
      </TabPanel>

      {fetching && <CircularProgress />}
      {
        false && <Table>
          <TableHead>
            <TableRow>
              <TableCell className="sticky-header">Date</TableCell>
              <TableCell className="sticky-header">Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody style={{ overflowY: 'scroll' }}>
            {times && times.map(o => <TableRow key={o.publish_type + '-' + o.print_date}>
              <TableCell>{o.publish_type + ': ' + o.print_date}</TableCell>
              <TableCell>{format(o.solveTimeMs)}</TableCell>
            </TableRow>)}
          </TableBody>
        </Table>
      }

    </div >
  )
};

export default TimeTable;