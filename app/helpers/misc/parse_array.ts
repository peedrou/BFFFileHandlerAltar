export const parseEnvArray = (envVar: string | undefined): string[] => {
  if (!envVar) return [];
  try {
    return JSON.parse(envVar.replace(/'/g, '"'));
  } catch (error) {
    console.error('Failed to parse DEPENDENCIES:', error);
    return [];
  }
};
