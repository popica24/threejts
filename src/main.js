import './styles/base.css';
import './styles/chapters.css';
import content from './content.js';
import { CREDIT } from './config.js';
import { renderChapters } from './dom/chapters.js';
import { createLoader } from './ui/loader.js';

const loader = createLoader(document.getElementById('loader'));
renderChapters(document.getElementById('chapters'), content, CREDIT);
loader.setProgress(1);
loader.done();
