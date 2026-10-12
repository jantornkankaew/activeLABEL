import {MeasurementProvider} from './MeasurementContext';
import {createRoot} from 'react-dom/client';
import {ChatGPTWidget} from './ChatGPTWidget';
import './chatgpt.css';
createRoot(document.getElementById('root')!).render(<MeasurementProvider><ChatGPTWidget/></MeasurementProvider>);
