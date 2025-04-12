import {Event} from "./eventActions";

interface UserACL {
    user: any,
    userRole: string,
    userGroups: any[],
    individual: {
        events: {
            target: string,
            allowedOperations: string[],
        }
    }
    docker: UserDockerACL,
}

interface UserDockerACL {
    user: {
        read: boolean,
        write: boolean,
        create: boolean,
        delete: boolean,
    }
    events: {
        read: boolean,
        write: boolean,
        create: boolean,
        delete: boolean,
    },
    news: {
        read: boolean,
        write: boolean,
        create: boolean,
        delete: boolean,
    },
    apps: {
        protocol: boolean,
    }
    system: {
        qualifications: boolean,
        logs: boolean,
        events: boolean,
        user: boolean,
        groups: boolean,
        system: boolean,
        mail: boolean,
        auth: boolean,
        development: boolean,
    }
}

interface AclActions {
    getCurrentUserAcl: () => Promise<UserACL>;
    getCurrentUserDockerAcl: () => Promise<UserDockerACL>;
}

const aclActions: AclActions = {
    async getCurrentUserAcl(){
        return new Promise((resolve, reject) => {

            $.ajax({
                url: "/api/v1/acl/current/",
                type: "GET",
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: (acl: UserACL) => resolve(acl),
                error: (XMLHttpRequest: any, textStatus: string, errorThrown: any) => {
                    console.error(`AJAX error: ${XMLHttpRequest.status} ${XMLHttpRequest.statusText}`);
                    reject(errorThrown);
                },
            });
        })
    },
    async getCurrentUserDockerAcl(){
        return new Promise((resolve, reject) => {
            $.ajax({
                url: "/api/v1/acl/docker/",
                type: "GET",
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
                success: (dockerACL: UserDockerACL) => resolve(dockerACL),
                error: (XMLHttpRequest: any, textStatus: string, errorThrown: any) => {
                    console.error(`AJAX error: ${XMLHttpRequest.status} ${XMLHttpRequest.statusText}`);
                    reject(errorThrown);
                },
            });
        })
    }
}

export default aclActions;
