import './EntityTabs.css';

const EntityTabs = ({ tabs, activeKey, onChange }) => {
  const activeTabIndex = tabs.findIndex((tab) => tab.key === activeKey);

  return (
    <div className="entity-tabs__wrap">
      <div className="entity-tabs" style={{ '--tabs-count': tabs.length }}>
        <span
          className="entity-tabs__slider"
          style={{ transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)` }}
          aria-hidden="true"
        />

        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`entity-tabs__tab ${activeKey === tab.key ? 'entity-tabs__tab--active' : ''}`}
            type="button"
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EntityTabs;
