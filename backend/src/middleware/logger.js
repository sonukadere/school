import morgan from 'morgan';
import env from '../config/env.js';

const logger = morgan(env.nodeEnv === 'production' ? 'combined' : 'dev');

export default logger;
