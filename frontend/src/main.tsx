import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { AppRouter } from '@/app/routes';
import { store } from '@/app/providers/store';
import { ThemeProvider } from '@/app/providers/theme';
import '@/app/styles/global.scss';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

root.render(
  <Provider store={store}>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </Provider>
);
