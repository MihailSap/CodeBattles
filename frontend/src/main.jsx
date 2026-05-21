import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { AppRouter } from '@/app/routes';
import { store } from '@/app/providers/store';
import { ThemeProvider } from '@/app/providers/theme';
import '@/app/styles/global.scss';
const root = createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </Provider>
);
