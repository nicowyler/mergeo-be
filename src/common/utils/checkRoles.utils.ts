// import { UnauthorizedException } from '@nestjs/common';

export const checkRoles = (payload: any) => {
  //   const roles = (payload as { roles?: Role | Role[] }).roles;

  //   if (!roles) {
  //     throw new UnauthorizedException(
  //       'No tienes permiso para realizar esta acción!',
  //     );
  //   }

  //   const rolesArray = Array.isArray(roles) ? roles : [roles];

  //   const validRoles = rolesArray.filter((role) =>
  //     Object.values(Role).includes(role),
  //   );

  //   if (validRoles.length === 0) {
  //     throw new UnauthorizedException(
  //       'No tienes permiso para realizar esta acción!',
  //     );
  //   }
  return payload;
};
