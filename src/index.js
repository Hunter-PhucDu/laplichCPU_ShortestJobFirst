import React from 'react';
import { createRoot } from 'react-dom/client'; // Thêm import createRoot từ react-dom
import './index.css';
import App from './App';

const root = createRoot(document.getElementById('root')); // Sử dụng createRoot để khởi tạo ứng dụng
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
