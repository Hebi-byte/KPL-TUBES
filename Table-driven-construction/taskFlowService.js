const { statusTransitions } = require("./transitionConfig");


// function untuk cek apakah transisi valid
function canTransition(currentStatusId, nextStatusId, userRole) {

  return statusTransitions.some((transition) => {

    return (
      transition.from_status_id === currentStatusId &&
      transition.to_status_id === nextStatusId &&
      transition.allowed_role === userRole
    );

  });
}


// export function
module.exports = {
  canTransition,
};