export interface Speaker {
  id: number;
  name: string;
  function: string | null;
  party_afkorting: string | null;
  party_name_nl: string | null;
  party_name_en: string | null;
  image_url: string;
  resolved: boolean;
}
