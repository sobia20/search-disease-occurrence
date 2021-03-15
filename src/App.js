import './App.css';
import DiseaseChart from './components/diseaseChart.js';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';

function App() {
  return (
    <div className="App">
    <AppBar position="static">
      <Typography variant="h6">
        Find the number of occurrances of a disease or disease area in PubMed database
      </Typography>
    </AppBar>
    <DiseaseChart/>
    </div>
  );
}

export default App;
