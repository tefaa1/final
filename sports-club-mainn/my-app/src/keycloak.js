import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://keycloak:8443", // لازم نفس العنوان اللي في الـ hosts
  realm: "mscms",
  clientId: "mscms-frontend",
});

export default keycloak;