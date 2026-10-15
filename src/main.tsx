import {MeasurementProvider} from './MeasurementContext';
import {createRoot} from 'react-dom/client';
import App from './App';
import './style.css';
import './atelier.css';
import './formula.css';
createRoot(document.getElementById('root')!).render(<MeasurementProvider><App/></MeasurementProvider>);
