/**
 * User type definitions shared between frontend and backend
 */

export interface IUser {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserCreate {
    username: string;
    email: string;
    password: string;
    displayName: string;
}

export interface IUserLogin {
    email: string;
    password: string;
}

export interface IUserResponse {
    user: Omit<IUser, 'password'>;
    token: string;
}

export interface IActiveUser {
    id: string;
    username: string;
    displayName: string;
    color: string;
}
