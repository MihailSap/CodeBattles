import entityTabsStyles from './EntityTabs.module.scss';

const EntityTabs = ({ tabs, activeKey, onChange }: LegacyValue) => {
  const activeTabIndex = tabs.findIndex((tab: LegacyValue) => tab.key === activeKey);

  return (
    <div className={entityTabsStyles.wrap}>
      <div
        className={entityTabsStyles.root}
        style={{
          '--tabs-count': tabs.length,
        }}
      >
        <span
          className={entityTabsStyles.slider}
          style={{
            transform: `translateX(${Math.max(0, activeTabIndex) * 100}%)`,
          }}
          aria-hidden="true"
        />

        {tabs.map((tab: LegacyValue) => (
          <button
            key={tab.key}
            className={[entityTabsStyles.tab, activeKey === tab.key ? entityTabsStyles.isActive : '']
              .filter(Boolean)
              .join(' ')}
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
