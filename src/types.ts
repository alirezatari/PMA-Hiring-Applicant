export type JobGroup = {
  jobGroupId?: number;
  title?: string;

  description?: string | null;
  jobRequirements?: string | null;
  benefits?: string | null;

  cityName?: string | null; // ✅ قبلاً city بود

  minWorkExperience?: number | null;
  minEducationLevelId?: number | null;
  educationLevelName?: string | null;

  employmentTypeId?: number | null;
  employmentTypeName?: string | null;

  isRemoteAllowed?: boolean | null;
};
