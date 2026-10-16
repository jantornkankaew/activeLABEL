import {MeasurementProvider} from './MeasurementContext';
import {createRoot} from 'react-dom/client';
import App from './App';
import {registerServiceWorker} from './serviceWorkerRegistration';
import './style.css';
import './atelier.css';
import './formula.css';
import './close-project.css';
import './network-status.css';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(<MeasurementProvider><App/></MeasurementProvider>);
