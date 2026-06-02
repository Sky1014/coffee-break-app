import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import SettingsPage from './SettingsPage';
import './styles.css';

function Root() {
  const [hash, setHash] = React.useState(() => window.location.hash);

  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (hash === '#settings') {
    return <SettingsPage />;
  }
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
