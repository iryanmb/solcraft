"use client";

// A React hook: asks the store who is signed in when a screen opens.
// Returns undefined while it's still checking, then the Account (null = signed out).

import { useEffect, useState } from "react";
import { getAccount, type Account } from "./store";

export function useAccount(): Account | undefined {
  const [account, setAccount] = useState<Account | undefined>(undefined);

  useEffect(() => {
    let current = true; // ignore the answer if the screen closed meanwhile
    getAccount()
      .then((value) => current && setAccount(value))
      .catch(() => current && setAccount(null));
    return () => {
      current = false;
    };
  }, []);

  return account;
}
