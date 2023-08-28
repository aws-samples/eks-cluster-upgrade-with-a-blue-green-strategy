import * as eks from "aws-cdk-lib/aws-eks";
import { loadYaml, readYamlDocument } from "@aws-quickstart/eks-blueprints/dist/utils";

export function demoApplicationDeploy(cluster: eks.ICluster, manifestName: string) {
    const doc = readYamlDocument(__dirname + `/manifests/${manifestName}.yaml`);
    const manifest = doc.split("---").map(e => loadYaml(e));
    new eks.KubernetesManifest(cluster.stack, "demo-application-manifest", {
      cluster,
      manifest,
      overwrite: true
    });
}