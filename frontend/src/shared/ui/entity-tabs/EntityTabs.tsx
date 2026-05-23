import entityTabsStyles from './EntityTabs.module.scss';

interface TabItem {
  key: string;
  label: string;
}

interface EntityTabsProps {
  tabs: TabItem[];
  activeKey: string | null;
  onChange: (key: string) => void;
  wrapClassName?: string;
  tabClassName?: string;
}

const EntityTabs = ({ tabs, activeKey, onChange, wrapClassName = '', tabClassName = '' }: EntityTabsProps) => {
  const activeTabIndex = tabs.findIndex((tab) => tab.key === activeKey);

  return (
    <div className={[entityTabsStyles.wrap, wrapClassName].filter(Boolean).join(' ')}>
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

        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={[entityTabsStyles.tab, tabClassName, activeKey === tab.key ? entityTabsStyles.isActive : '']
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
