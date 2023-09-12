import * as eks from "aws-cdk-lib/aws-eks";
import { loadYaml, readYamlDocument } from "@aws-quickstart/eks-blueprints/dist/utils";

/**
 * Deploy the demo web application by referring to the manifest file in the 'utils/manifests' directory.
 * If a 'publicHostedZoneName' is passed as an argument,
 * the value 'external-dns.alpha.kubernetes.io/hostname' in the manifest content
 * is changed to the name of the passed public hosted zone with the 'weighted' prefix added.
 *
 * @param cluster
 * @param manifestName
 * @param publicHostedZoneName
 */
export function demoApplicationDeploy(
  cluster: eks.ICluster,
  manifestName: string,
  publicHostedZoneName?: string
) {
  const doc = readYamlDocument(__dirname + `/manifests/${manifestName}.yaml`);
  const manifest = doc.split("---").map((e) => loadYaml(e));

  if (publicHostedZoneName) {
    const weightedDomain = "weighted." + publicHostedZoneName;
    manifest[2].metadata.annotations["external-dns.alpha.kubernetes.io/hostname"] = weightedDomain;
    console.log("Change Public Hosted Zone Name : " + manifest[2].metadata.annotations["external-dns.alpha.kubernetes.io/hostname"]);
  }

  new eks.KubernetesManifest(cluster.stack, "demo-application-manifest", {
    cluster,
    manifest,
    overwrite: true,
  });
}
