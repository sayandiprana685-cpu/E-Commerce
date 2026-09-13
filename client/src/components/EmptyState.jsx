import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ icon, title, message, description, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon || <FiInbox />}</div>
    <h3>{title}</h3>
    <p>{description || message}</p>
    {action}
  </div>
);

export default EmptyState;
