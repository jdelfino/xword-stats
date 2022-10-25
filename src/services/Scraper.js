import Dexie from 'dexie';

const axios = require("axios");
const moment = require('moment')

//const nyts = "3w4DjC.OK.kXxn0GA9iI//U.oeETWQUIrPXi8cQXCbq67XS6LZ3sVzEYZit1RpmkKsjOoea6bgYnQZRe3IhyWEURucoTa7J8Ur2csvoD.ZrC1H8AioKY70k9SbJmrXZlkBGUWFJunzhC4mqq2KWt2gCzGADATmeSEl7XIeRl9sVDGif4o/88kiWCMKgY.A8Y3gxEwQsjmOvtYa0q5wbY.3g0lUeiuEpOdHtPruZtNGNoN4IrZAN19ZJSzwxKYr.JCFNcrUWwXg.49ttyODRXA2Rm.nLrgq6SBofcn95D2JPsU0"

class Scrapetastic {
    constructor() {
        this.db = new Dexie("MyDatabase");
        this.db.version(1).stores({
            puzzles: "puzzle_id, publish_type"
        });
    }

    listUrl(start, end, puzz_type) {
        return `https://master.d11mdk68f3uft3.amplifyapp.com/https://nyt-games-prd.appspot.com/svc/crosswords/v3/77678625/puzzles.json?publish_type=${puzz_type}&sort_order=asc&sort_by=print_date&date_start=${start.format('YYYY-MM-DD')}&date_end=${end.format('YYYY-MM-DD')}`
    }

    puzUrl(num) {
        return `https://master.d11mdk68f3uft3.amplifyapp.com/https://nyt-games-prd.appspot.com/svc/crosswords/v6/game/${num}.json`
    }


async getAllTimes() {
    return this.db.puzzles.toArray();
}

async fetchAllTimes(cookie, duration) {
    console.log("smartGetAllTimes", duration)
    let [keys, scrapes] = await Promise.all([
        this.db.puzzles.orderBy(":id").primaryKeys(),
        this.getTimes(cookie, moment().subtract(duration), moment())]);

    console.log("Keys", keys);
    console.log("Scraped", scrapes);
    let newDates = scrapes.filter(x => x.solved === true && !keys.includes(x.puzzle_id));
    console.log("Fetching new dates: ", newDates)

    return Promise.all(
        newDates.map(async entry => {
            let puzz = await this.fetchData(this.puzUrl(entry.puzzle_id), cookie);
            return this.db.puzzles.put({
                ...entry,
                solveTimeMs: puzz.calcs.secondsSpentSolving * 1000,
                firstOpened: puzz.firsts.opened,
                firstSolved: puzz.firsts.solved,
                dow: moment(entry.print_date).format("ddd"),
            });
        })
    )
}

async fetchData(url, cookie) {
    console.log(`fetching ${url}`)
    const result = await axios.get(url, { crossDomain: true, headers: { "nyt-s": cookie } } );
    return result.data
};

async getTimes(cookie, start, end) {
    console.log(`getTimes ${start} ${end}`)
    var currStart = moment(end).subtract(60, 'days');
    var toFetch = []
    while (end > start) {
        if (currStart < start) {
            currStart = moment(start);
        }
        toFetch.push([moment(currStart), moment(end)]);
        end = moment(currStart).subtract(1, 'days');
        currStart.subtract(60, 'days');
    }
    console.log("Ranges to fetch", toFetch)
    const dailys = toFetch.map(async x => {
        let fetch = await this.fetchData(this.listUrl(x[0], x[1], "daily"), cookie);
        return fetch.results;
    });
    const minis = toFetch.map(async x => {
        let fetch = await this.fetchData(this.listUrl(x[0], x[1], "mini"), cookie);
        return fetch.results;
    });
    let allResults = await Promise.all(dailys.concat(minis));
    return [].concat.apply([], allResults);
}

/*
async getAllTimes(cookie, duration) {
    console.log(`getting all times ${duration}`);

    const data = await this.getTimes(cookie, moment().subtract(duration), moment())

    //const by_dow = {Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: []};
    const by_date = [];
    for (const val of data) {
        //console.log(val)
        const puzz = await this.fetchData(this.puzUrl(val.puzzle_id), cookie);
        if(puzz.calcs.secondsSpentSolving) {

            const dow = moment(val.print_date).format("ddd");
            const solveTime = puzz.calcs.secondsSpentSolving;
            //by_dow[dow].push(solveTime);
            by_date.push({date: val.print_date, dow: dow, solveTime: solveTime * 1000});
        }
    }
    console.log(`returning ${by_date}`);
    return by_date;
}
*/

}
export const Scraper = new Scrapetastic()
//getAllTimes().then(console.log).catch(console.error)


/*
      /*
      { loaded &&
        <div>
          <Typography variant="h6">
              Mini
          </Typography>
          <VictoryChart domainPadding={20}>
          <VictoryAxis />
          <VictoryAxis dependentAxis
            tickValues={[15, 30, 45, 60, 75, 90, 120, 150, 180, 210]}
            tickCount={5}
            tickFormat={(x) => format(x * 1000)} />
          <VictoryBoxPlot
              boxWidth={20}
              medianLabels={true}
              medianLabelComponent={
                <VictoryLabel
                dx={0} dy={-10}
                textAnchor="middle"
                text={(datum) => {
                  console.log(datum);
                  return format(datum.datum._median * 1000)
                }}
                />
              }
              theme={VictoryTheme.material}
              data={Object.values(mini_bydow)}
              y='solveTimes'
              x='dow'
            />
          </VictoryChart>
          <Typography variant="h6">
              Daily
          </Typography>
          <VictoryChart domainPadding={20}>
            <VictoryBoxPlot
              boxWidth={20}
              theme={VictoryTheme.material}
              data={Object.values(daily_bydow)}
              y='solveTimes'
              x='dow'
            />
          </VictoryChart>

        </div>
      }
      */
