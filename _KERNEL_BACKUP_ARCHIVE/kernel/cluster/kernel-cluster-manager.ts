type KernelNode = {
  id: string;
  region: string;
  status: "ONLINE" | "OFFLINE";
};

class KernelClusterManager {

  private nodes: KernelNode[] = [];

  register(node: KernelNode) {

    this.nodes.push(node);

    console.log(
      "[CLUSTER NODE ONLINE]",
      node.id
    );
  }

  list() {
    return this.nodes;
  }

  onlineCount() {

    return this.nodes.filter(
      n => n.status === "ONLINE"
    ).length;
  }
}

export const kernelClusterManager =
  new KernelClusterManager();
