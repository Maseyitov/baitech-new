"use client";

const StatCard = ({ label, value, hint, icon: Icon, color = "blue" }) => (
  <div className={`stat-card stat-card--${color}`}>
    <div className="stat-card__icon">
      <Icon size={22} />
    </div>
    <div className="stat-card__body">
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </div>
  </div>
);

export default StatCard;
