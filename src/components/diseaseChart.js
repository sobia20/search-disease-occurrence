import React, { Component } from "react";
import {
  Container,
  InputAdornment,
  TextField,
  CssBaseline,
  Button
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import axios from "axios";
import "./diseaseChart.css";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { XYPlot, VerticalBarSeries, XAxis, YAxis } from "react-vis";

class DiseaseChart extends Component {
  state = {
    fromDateValue: null,
    toDateValue: null,
    fromYear: 0,
    toYear: 0,
    disease: "",
    yearList: [],
    mockData: [{ x: 2019, y: 33 }, { x: 2020, y: 22 }],
    concurrent: 0
  };
  componentDidMount() {}
  sendDisease = () => {
    let { fromYear, toYear, disease, yearList } = this.state;
    this.initializeChartData();
    axios
      .post(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&api_key=dbb9d1e2b75b1fc75acb3ec0fefc3745bd09&term=${disease}&retmode=json&datetype=pdat&retmax=0&mindate=${fromYear}&maxdate=${toYear}&usehistory=y&sort=pub+date`
      )
      .then(
        res => {
          let webenv = res.data.esearchresult.webenv;
          let querykey = res.data.esearchresult.querykey;
          let count = res.data.esearchresult.count;
          let retstart = 0;
          const max_ret = 10000;
          // const regex = /em std {\n\s*year (\d{4})/gm
          let loops_required = count / max_ret;
          let resData = "";

          console.log("Total Records to fetch: ", count);
          while (retstart <= loops_required) {
            console.log(
              `Fetching ${retstart + 1}/${parseInt(loops_required, 10) + 1}...`
            );
            // axios.post(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&WebEnv=${webenv}&api_key=dbb9d1e2b75b1fc75acb3ec0fefc3745bd09&query_key=${querykey}&retstart=${retstart}&retmax=10000`).then(res=>{
            this.fetchRetry(3, 900, webenv, querykey, retstart);
            // let match = ''
            // let intyear = 0
            // let matchyear = 0
            // while(match!==null){
            //   match = regex.exec(resData)
            //   if(match!==null){
            //     matchyear = parseInt(match[1],10)
            //     intyear = matchyear-fromYear
            //     try{
            //       yearList[intyear]['y']++
            //     }
            //     catch(err){
            //       console.log("Error saving for year: ",matchyear)
            //       continue
            //     }

            //   }
            // }
            // this.setState({yearList: yearList})
            // console.log('yearList ', this.state.yearList)
            // })
            retstart++;
          }
        },
        error => {
          console.log(error);
        }
      );
  };
  initializeChartData = () => {
    let { fromYear, toYear, yearList } = this.state;
    this.setState({ yearList: [] });
    while (fromYear <= toYear) {
      yearList.push({ x: fromYear, y: 0 });
      fromYear++;
    }
    this.setState({ yearList: yearList });
    return yearList;
  };

  fromDate = e => {
    this.setState({
      fromDateValue: e,
      fromYear: e.getFullYear()
    });
  };

  toDate = e => {
    this.setState({
      toDateValue: e,
      toYear: e.getFullYear()
    });
  };
  setDisease = e => {
    this.setState({ disease: e.target.value });
  };

  findYearInData = data => {
    let { fromYear, yearList } = this.state;
    const regex = /em std {\n\s*year (\d{4})/gm;
    let match = "";
    let intyear = 0;
    let matchyear = 0;
    while (match !== null) {
      match = regex.exec(data);
      if (match !== null) {
        matchyear = parseInt(match[1], 10);
        intyear = matchyear - fromYear;
        try {
          yearList[intyear]["y"]++;
        } catch (err) {
          console.log("Error saving for year: ", matchyear);
          continue;
        }
      }
    }
    this.setState({ yearList: yearList });
    console.log("yearList ", this.state.yearList);
  };

  fetchRetry = (retries = 3, backoff = 300, webenv, querykey, retstart) => {
    const retryCodes = [408, 500, 502, 503, 504, 522, 524, 400];
    const sleepingCodes = [429]
    return axios
      .post(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&WebEnv=${webenv}&api_key=dbb9d1e2b75b1fc75acb3ec0fefc3745bd09&query_key=${querykey}&retstart=${retstart}&retmax=10000`
      )
      .then(res => {
        console.log(`Fetched successfully (${retstart+1})`)
        return this.findYearInData(res.data);


      })
      .catch(res=> { if(res.response){
        if (sleepingCodes.includes(res.response.status)){
          console.log("Sleeping for 30 seconds... already 10 connections")
          setTimeout(() => {
            return this.fetchRetry(
              retries,
              backoff,
              webenv,
              querykey,
              retstart
            ); /* 3 */
          }, 1000*30);
        }

        if (retries > 0 && retryCodes.includes(res.response.status)) {
          console.log(`Backing off for ${backoff}`)
          setTimeout(() => {
            return this.fetchRetry(
              retries - 1,
              backoff * 3,
              webenv,
              querykey,
              retstart
            ); /* 3 */
          }, backoff);
        }}
         else {
          console.log("Status Code is Unknown")
          console.log(res)
        }
    
      });
  };

  render() {
    return (
      <React.Fragment>
        <CssBaseline />
        <Container maxWidth="sm" className="container-margin">
          <form style={{ marginBottom: 80 }}>
            <TextField
              onBlur={this.setDisease}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.target.blur();
                  this.setDisease(e);
                }
              }}
              autoFocus={true}
              fullWidth
              label="Search a disease or disease area..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <span className={"date-grid"}>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <DatePicker
                  views={["year"]}
                  label="From"
                  variant="inline"
                  onChange={this.fromDate}
                  autoOk={true}
                  value={this.state.fromDateValue}
                  disableFuture={true}
                />
                <DatePicker
                  views={["year"]}
                  label="To"
                  variant="inline"
                  onChange={this.toDate}
                  autoOk={true}
                  value={this.state.toDateValue}
                  disableFuture={true}
                />
              </MuiPickersUtilsProvider>
            </span>
            <Button
              className="submit-button"
              color={"primary"}
              variant="contained"
              onClick={this.sendDisease}
            >
              Submit
            </Button>
          </form>
        </Container>
        <div style={{ marginLeft: 60 }}>
          {this.state.yearList && (
            <XYPlot
              margin={{ bottom: 100 }}
              animation
              xType="ordinal"
              width={1200}
              height={350}
              // yDomain={chartDomain}
            >
              <XAxis title="Year" tickLabelAngle={-90} />
              <YAxis title="Occurence" />
              <VerticalBarSeries data={this.state.yearList} />
            </XYPlot>
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default DiseaseChart;
