import React from 'react';
import { Slider } from '@material-ui/core';
import moment from 'moment';
import Plot from 'react-plotly.js';

function Charts(props) {
  const [dailySlider, setDailySlider] = React.useState([1,2]);

  const handleSlider = (event, newValue) => {
    setDailySlider(newValue);
  };

  function days_of_week() {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }

  function computeWhiskerData(filt_times) {
    return days_of_week().map(dow => {
      return {
        name: dow,
        type: 'box',
        y: filt_times.filter(x => x.dow === dow).map(x => x.solveTimeMs / 1000),
        boxpoints: 'all',
        jitter: 0.5,
        whiskerwidth: 0.2,
        fillcolor: 'cls',
        marker: {
          size: 2
        },
        line: {
          width: 1
        }
      }
    });
  }

  function mavg(vals, per) {
    let rval = new Array(vals.length).fill(null);
    vals.forEach(function (item, index) {
      if (index < per) { return; }
      let cur = index;
      let sum = 0;
      let ct = 0;
      while(cur > 0 && ct < per) {
        if (vals[cur] != null) {
          sum += vals[cur];
          ct += 1;
        }
        cur -= 1;
      }
      if (ct > 0) {
        rval[index] = sum / ct;
      }
    });
    return rval;
  }

  function heatmap(filt_times) {
    if (filt_times.length === 0) { return []; }

    const weeks = get_weeks(filt_times);
    const dows = {};
    for (const d of days_of_week()) {
      dows[d] = new Array(weeks.length);
    }

    for (const time of filt_times) {
      const week_index = weeks.indexOf(moment(time.print_date).format('W-GG'));
      dows[time.dow][week_index] = time.solveTimeMs / 1000;
    }

    return [{
      type: 'heatmap',
      hoverongaps: false,
      x: weeks.map(x => moment(x, 'W-GG').format('YYYY-MM-DD')),
      y: days_of_week().reverse(),
      z: days_of_week().reverse().map(x => dows[x]),
      colorscale: [
        ['0.0', 'rgb(165,0,38)'],
        ['0.025', 'rgb(215,48,39)'],
        ['0.05', 'rgb(244,109,67)'],
        ['0.075', 'rgb(253,174,97)'],
        ['0.1', 'rgb(254,224,144)'],
        ['0.15', 'rgb(224,243,248)'],
        ['0.2', 'rgb(171,217,233)'],
        ['0.25', 'rgb(116,173,209)'],
        ['0.35', 'rgb(69,117,180)'],
        ['1.0', 'rgb(49,54,149)']
      ],
    }]
  }

  function computeMovingAvgs(filt_times) {
    if (filt_times.length === 0) { return []; }

    const weeks = get_weeks(filt_times);
    const dows = {};
    for (const d of days_of_week()) {
      dows[d] = new Array(weeks.length);
    }

    for (const time of filt_times) {
      const week_index = weeks.indexOf(moment(time.print_date).format('W-GG'));
      dows[time.dow][week_index] = time.solveTimeMs / 1000;
    }

    return days_of_week().map(dow => {
      return {
        x: weeks.map(x => moment(x, 'W-GG').format('YYYY-MM-DD')),
        y: mavg(dows[dow], 5),
        line: {shape: 'spline'},
        type: 'scatter',
        mode: 'lines+markers',
        name: dow,
      }
    });
  }

  function get_weeks(filt_times) {
    if (filt_times.length === 0) { return []; }

    let weeks = [];

    let curr = moment(filt_times[0].print_date)
    let last = moment(filt_times[filt_times.length - 1].print_date);
    while (curr < last) {
      weeks.push(curr.format('W-GG'));
      curr.add(1, 'week');
    }
    return weeks;
  }

  function make_weekly(filt_times) {
    if (filt_times.length === 0) { return []; }

    let weeks = get_weeks(filt_times);

    const byweek = new Array(weeks.length).fill(0);
    const byweek_gold = new Array(weeks.length).fill(0);

    for (const line of filt_times) {
      const week = moment(line.print_date).format('W-GG');
      if (line.star === "Gold") {
        byweek_gold[weeks.indexOf(week)] += 1;
      }
      else {
        byweek[weeks.indexOf(week)] += 1;
      }
    }

    return [
      {
        x: weeks.map(x => moment(x, 'W-GG').format('YYYY-MM-DD')), //weeks, // [weeks.map(x => moment(x, 'W-yyyy').format('MMM-YY')), weeks],
        y: byweek_gold,
        name: "Gold stars",
        type: 'bar',
        marker: {
          color: 'gold',
        },
      },
      {
        x: weeks.map(x => moment(x, 'W-GG').format('YYYY-MM-DD')), //weeks, // [weeks.map(x => moment(x, 'W-yyyy').format('MMM-YY')), weeks],
        y: byweek,
        name: "Blue stars",
        type: 'bar',
        marker: {
          color: 'blue',
        },
      },
    ];
  }

  function computeData(filt_times) {
    return {
      whisker: computeWhiskerData(filt_times),
      weeks: get_weeks(filt_times),
      weekly_counts: make_weekly(filt_times),
      mavg: computeMovingAvgs(filt_times),
      heatmap: heatmap(filt_times)
    };
  }

  const data = computeData(props.filtered_times)
  console.log(data)

  return (<div>
    <Plot
      data={data.weekly_counts}
      layout={ {
        title: 'Counts by week',
        barmode: 'stack',
        width: 1500,
        height: 300,
        yaxis: {
          tickvals: [1,3,5,7],
        },
      } }
    />
    <Plot
      data={data.whisker}
      layout={ {
        title: 'Times by day of week',
        yaxis: {
          autorange: true,
          showgrid: true,
          zeroline: true,
          gridcolor: 'gray',
          gridwidth: 1,
          zerolinecolor: 'gray',
          zerolinewidth: 2,
        },
        paper_bgcolor: 'rgb(243, 243, 243)',
        plot_bgcolor: 'rgb(243, 243, 243)',
        width: 1500,
      } }
    />
    <Plot
      data={data.mavg}
      layout={ {
        title: 'Moving average by day of week',
        width: 1500,
        yaxis: {
          autorange: true,
          showgrid: true
        },
      } }
    />
    <Plot
      data={data.heatmap}
      layout={ {
        title: 'HEATMAP',
        width: 1500,
        paper_bgcolor: 'rgb(243, 243, 243)',
        plot_bgcolor: 'rgb(243, 243, 243)',
      } }
    />
  </div>
  )
};

export default Charts;