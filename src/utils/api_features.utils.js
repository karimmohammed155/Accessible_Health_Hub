export class api_features {
  constructor(mongoose_query, query) {
    this.mongoose_query = mongoose_query;
    this.query = query;
  }

  //sort
  sort() {
    this.mongoose_query.sort({ createdAt: -1 });
    return this;
  }

  //pagination
  pagination() {
    const { page = 1, limit = 2 } = this.query;
    const skip = (page - 1) * limit;

    this.mongoose_query.skip(skip).limit(limit);
    return this;
  }

  //filters
  filters() {
    const { page = 1, limit = 2, sort, ...filters } = this.query;
    const filter_as_string = JSON.stringify(filters);
    const replaced_filters = filter_as_string.replaceAll(
      /lt|gt|gte|lte|regex|ne|eq/g,
      (ele) => `$${ele}`
    );
    const parsed_filters = JSON.parse(replaced_filters);
    this.mongoose_query.find(parsed_filters);
    return this;
  }
}
