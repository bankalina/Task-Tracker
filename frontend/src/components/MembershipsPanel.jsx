const ROLES = ["Owner", "Assigned", "Viewer"];

function MembershipsPanel({
  selectedTask,
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
    <section>
      <h2>Members</h2>
      {selectedTask && (
        <p>
          <button onClick={() => onRefreshMemberships(selectedTask.id)}>Refresh members</button>
        </p>
      )}
      {membershipsError && <p>{membershipsError}</p>}
      {membershipsLoading && <p>Loading members...</p>}

      {selectedTask && (
        <form onSubmit={onMembershipCreate}>
          <p>
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
          </p>
          <p>
            <select
              value={membershipForm.role}
              onChange={(event) => setMembershipForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              {ROLES.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </p>
          {membershipError && <p>{membershipError}</p>}
          <button disabled={membershipBusy}>{membershipBusy ? "Adding..." : "Add member"}</button>
        </form>
      )}

      <ul>
        {memberships.map((membership) => (
          <li key={membership.id}>
            {membership.user?.username || `User ${membership.user_id}`}{" "}
            <select
              value={membership.role}
              onChange={(event) => onMembershipRoleUpdate(membership.user.id, event.target.value)}
            >
              {ROLES.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>{" "}
            {membership.role !== "Owner" && (
              <button onClick={() => onMembershipDelete(membership.user.id)}>Remove</button>
            )}
          </li>
        ))}
        {!memberships.length && !membershipsLoading && <li>No members yet.</li>}
      </ul>
    </section>
  );
}

export default MembershipsPanel;
