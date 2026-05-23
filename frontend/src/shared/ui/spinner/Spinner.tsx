import spinnerStyles from './Spinner.module.scss';

const Spinner = () => {
  return <div className={spinnerStyles.root} aria-label="Загрузка" />;
};

export default Spinner;
