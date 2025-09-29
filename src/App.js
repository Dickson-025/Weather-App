import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faMagnifyingGlass, faWind, faTemperatureHigh } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react';
import axios from 'axios';
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API_KEY = process.env.REACT_APP_WEATHER_TOKEN_API_KEY;

function App() {
  const[search, setSearch] = useState(localStorage.getItem('Location') || 'Mumbai');
  const[debounceSearch, setDebounceSearch] = useState(localStorage.getItem('Location') || 'Mumbai');
  const[weather, setWeatherData] = useState(null);
  const[foreCast, setForeCast] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loader, setLoader] = useState(true);

  useEffect(()=>{
    const handler = setTimeout(()=>{
      setDebounceSearch(search)
    }, 500)

    return () => { clearTimeout(handler) }
  },[search])

  useEffect(() => {
    if(!debounceSearch) return;

    const fetchWeather = async(data) => {
      try {
        setProgress(50);
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${data.lat}&lon=${data.lon}&appid=${API_KEY}`,
          {
            onDownloadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 50) / progressEvent.total);
                setProgress(50 + percent);
              }
            }
          }
        );
        setWeatherData(response?.data?.list[0]);
        let weathertime = response?.data?.list[0].dt_txt.split(" ")[1];
        let forecast = response?.data?.list.filter((i)=>i.dt_txt.split(" ")[1] === weathertime);
        setForeCast(forecast)
        setProgress(100);
        localStorage.setItem('Location', debounceSearch);
        setTimeout(()=> {
          setLoader(false);
          setProgress(0);
        }, 1000)
      } catch (error) {
        console.log(error)
        setProgress(0)
        setLoader(false)
      }
    }

    const fetchLoc = async() => {
      try {
        setProgress(10)
        setLoader(true)
        const response = await axios.get(`https://api.openweathermap.org/geo/1.0/direct?q=${debounceSearch}&limit=1&appid=${API_KEY}`);
        setProgress(25)
        fetchWeather(response?.data[0])
      } catch (error) {
        console.log(error)
        setProgress(0)
        setLoader(false)
      }
    }
    fetchLoc();
  }, [debounceSearch])

  const toTitleCase = (str) => {
    if(!str) return
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className='title'><span style={{padding: '1rem'}}><FontAwesomeIcon icon={faCloud} className='icon'/>Weather</span></div>
        <div className='container'>
          <div className='d-flex flex-column align-items-center'>
            <InputGroup className="mb-3">
              <InputGroup.Text id="basic-addon1"><FontAwesomeIcon className='search-icon' icon={faMagnifyingGlass} /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search city"
                aria-label="Search city"
                aria-describedby="basic-addon1"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </InputGroup>
            {/* <div style={{width:'100%'}}>
              <FontAwesomeIcon className='search-icon' icon={faMagnifyingGlass} />
              <input className='search' id='search' placeholder="Search for a city" type="text" onChange={e => setSearch(e.target.value)} />
            </div> */}
            <div className='card'>
              {
                loader ? (
                  <div className='dataLoading'>
                  <div className='fs-6 text-start w-100 ms-2'>Loading...</div>
                  <ProgressBar animated now={progress} />
                  <Skeleton width={'100%'} height={'50px'}></Skeleton>
                  <Skeleton width={'40%'} height={'40px'}></Skeleton>
                  <Skeleton width={'20%'} height={'20px'}></Skeleton>
                  <Skeleton className='mt-4' width={'100%'} height={'20px'}></Skeleton>
                </div> ) : (
                <div className='dataLoaded'>
                  <div className='temperature fs-1'>{isNaN((weather?.main?.temp - 273.15).toFixed(2)) ? 0 : (weather?.main?.temp - 273.15).toFixed(2)}°<span style={{color: 'skyblue'}}>C</span></div>
                  <div className='fs-3 fw-semibold mt-2'>{toTitleCase(weather?.weather[0].description) || '-/-'}</div>
                  <div className='fs-6 mt-2'>Humidity: {weather?.main?.humidity || 0}%</div>
                  <div className='d-flex justify-content-between mt-4' style={{fontSize: '0.8rem'}}>
                    <div>
                      <FontAwesomeIcon icon={faWind} /> {((weather?.wind?.speed * 3.6).toFixed(2)) || 0} Km/hr
                    </div>
                    <div>
                      <FontAwesomeIcon icon={faTemperatureHigh} /> Feels like {isNaN((weather?.main?.feels_like - 273.15).toFixed(2)) ? 0 : (weather?.main?.feels_like - 273.15).toFixed(2)}°
                    </div>
                  </div>
                </div>
                )
              }
            </div>
          </div>
          <div>
            <Card>
              <Card.Body>
                <Card.Title> 5 - Days Forecast </Card.Title>
                <Card.Text>
                  {/* { 
                    foreCast.map((item)=> 
                      <div></div>
                    )
                  } */}

                  { loader ? (<div>
                    <Skeleton width={'100%'} height={'60px'}></Skeleton>
                    <Skeleton width={'100%'} height={'60px'}></Skeleton>
                    <Skeleton width={'100%'} height={'60px'}></Skeleton>
                    <Skeleton width={'100%'} height={'60px'}></Skeleton>
                    <Skeleton width={'100%'} height={'60px'}></Skeleton>
                  </div>) :
                  (
                    Array.isArray(foreCast) && foreCast.length > 0 ? (
                      foreCast.map((item, index) => {
                        const celsius = item?.main?.temp ? parseInt(item?.main?.temp - 273.15) : '0.00';
                        const mincelcsius = item?.main?.temp ? parseInt(item?.main?.temp - 273.15) : '0.00';
                        const day = new Date(item.dt_txt.split(" ")[0]).toLocaleDateString("en-US", { weekday: "long" });
                        
                        return (
                          <div key={index} className='forecast'>
                            <div>
                              <div className='fs-4 fw-semibold text-start'>{toTitleCase(day)}</div>
                              <div className='fs-6 text-start'>{toTitleCase(item?.weather[0].description)}</div>
                            </div>
                            <div className='fs-6'>
                              {celsius}°/{mincelcsius}°
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className='forecast'>No forecast data</div>
                    )
                  )}
                </Card.Text>
              </Card.Body>
            </Card>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
