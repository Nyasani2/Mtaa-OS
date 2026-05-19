export interface KernelAppContract {
  id: string;

  name: string;

  domain: string;

  systemApp?: boolean;

  permissions?: string[];

  boot?: () => Promise<void>;

  mount?: () => Promise<void>;

  unmount?: () => Promise<void>;

  health?: () => Promise<number>;
}
