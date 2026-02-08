import { ROLES } from "../constants";

function MembershipsPanel({
  selectedTask,
  currentUserId,
  canManageMemberships,
  users,
  memberships,
  membershipsLoading,
  membershipsError,
  membershipForm,
  setMembershipForm,
  membershipBusy,
  membershipError,
  onMembershipCreate,
  onMembershipRoleUpdate,
  onMembershipDelete,
  onRefreshMemberships,
}) {
  return (
    <section className="panel panel--memberships">
      <div className="panel-head">
        <h2>Members</h2>
        {selectedTask && (
          <button type="button" onClick={() => onRefreshMemberships(selectedTask.id)}>
            Refresh members
          </button>
        )}
      </div>

      {selectedTask && canManageMemberships && (
        <form className="form-grid" onSubmit={onMembershipCreate}>
          <div className="row two-col">
            <label className="field">
              <span>User</span>
              <select
                value={membershipForm.user_id}
                onChange={(event) =>
                  setMembershipForm((prev) => ({ ...prev, user_id: event.target.value }))
                }
                required
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Role</span>
              <select
                value={membershipForm.role}
                onChange={(event) => setMembershipForm((prev) => ({ ...prev, role: event.target.value }))}
              >
                {ROLES.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          </div>
          {membershipError && <p className="feedback feedback--error">{membershipError}</p>}
          <button disabled={membershipBusy}>{membershipBusy ? "Adding..." : "Add member"}</button>
        </form>
      )}
      {selectedTask && !canManageMemberships && (
        <p className="feedback">Only task owner can manage memberships.</p>
      )}
      {membershipsError && <p className="feedback feedback--error">{membershipsError}</p>}
      {membershipsLoading && <p className="feedback">Loading members...</p>}

      <ul className="item-list">
        {memberships.map((membership) => {
          const memberId = membership.user?.id ?? membership.user_id ?? null;
          const isCurrentUser = memberId === currentUserId;
          const canEditThisMember = canManageMemberships && !isCurrentUser;
          return (
            <li key={membership.id}>
              <div className="split-row">
                <span className="item-title">{membership.user?.username || `User ${membership.user_id}`}</span>
                <span className="badge badge--role">{membership.role}</span>
              </div>
              <div className="row two-col">
                {canEditThisMember ? (
                  <label className="field compact-field">
                    <span>Update role</span>
                    <select
                      value={membership.role}
                      onChange={(event) => onMembershipRoleUpdate(memberId, event.target.value)}
                      disabled={!memberId}
                    >
                      {ROLES.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <p className="feedback">{isCurrentUser ? "Your role cannot be changed here." : "Read only."}</p>
                )}
                {canEditThisMember && membership.role !== "Owner" && (
                  <button
                    type="button"
                    className="danger-button subtle-danger"
                    onClick={() => onMembershipDelete(memberId)}
                    disabled={!memberId}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {!memberships.length && !membershipsLoading && <li>No members yet.</li>}
      </ul>
    </section>
  );
}

export default MembershipsPanel;
