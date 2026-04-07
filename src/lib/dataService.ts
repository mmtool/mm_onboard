import mmAddress from '../data/mm_address.json';
import mmMcc from '../data/mm_mcc.json';
import mmNrc from '../data/mm_nrc.json';

export interface AddressRecord {
  Region: string;
  District: string;
  Township: string;
  'City EN': string;
  'City MM': string;
  'Postal Code': string;
}

export interface MccRecord {
  group: string;
  mcc_name: string;
  mcc_code: string;
}

export interface NrcData {
  no: string[];
  type: string[];
  no_tsp: Record<string, string[]>;
}

export const fetchAddressData = async (): Promise<AddressRecord[]> => {
  const flatData: AddressRecord[] = [];
  mmAddress.forEach((region: any) => {
    region.townships.forEach((township: any) => {
      flatData.push({
        Region: region.region_name,
        District: township.district_en,
        Township: township.township_name,
        'City EN': township.city_en,
        'City MM': township.city_mm,
        'Postal Code': township.postal_code
      });
    });
  });
  return flatData;
};

export const fetchMccData = async (): Promise<MccRecord[]> => {
  const flatData: MccRecord[] = [];
  mmMcc.forEach((group: any) => {
    group.mccs.forEach((mcc: any) => {
      flatData.push({
        group: group.group,
        mcc_name: mcc.mcc_name,
        mcc_code: mcc.mcc_code
      });
    });
  });
  return flatData;
};

export const fetchNrcData = async (): Promise<NrcData> => {
  return {
    no: mmNrc.nrc.no.map(n => n.toString()),
    type: mmNrc.nrc.type,
    no_tsp: mmNrc.nrc.no_tsp
  };
};
